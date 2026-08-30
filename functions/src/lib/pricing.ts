/**
 * Authoritative cart pricing.
 *
 * The browser only ever sends product IDs plus how much of each was ordered.
 * Every price, product name and discount in an order or a PaymentIntent is
 * derived here from the Firestore product catalog, so a tampered request can
 * change *what* is ordered but never *what it costs*.
 *
 * The discount rules mirror app/context/CartContext.tsx exactly — if the two
 * ever drift, checkout breaks because createOrder rejects the PaymentIntent
 * amount. Change them together.
 */
import type {Firestore} from "firebase-admin/firestore";
import {HttpsError} from "firebase-functions/v2/https";
import {CURRENCY, roundCurrency} from "./money.js";

/** Cart lines are rejected beyond these bounds before anything is priced. */
const MAX_LINES = 100;
const MAX_QUANTITY = 100;
const MAX_PIECES = 500;
const MAX_WEIGHT_IN_GRAMS = 20_000;

export const MINIMUM_ORDER_SUBTOTAL = 10;

const ROLLE_BUNDLE_SIZE = 5;
const BOEREK_BUNDLE_SIZE = 11;

export type PricingUnit = "per_100g" | "per_item";

/** What the browser is allowed to tell us about a cart line. */
export interface CartLineInput {
	productId: string;
	quantity: number;
	weightInGrams?: number;
	pieces?: number;
}

/** A cart line after the catalog has supplied name, price and category. */
export interface PricedLine {
	id: string;
	name: string;
	quantity: number;
	unitPrice: number;
	lineTotal: number;
	pricingUnit: PricingUnit;
	category: string;
	weightInGrams?: number;
	pieces?: number;
	imageUrl?: string;
	/** Unrounded unit price, used for arithmetic so we round exactly once. */
	rawUnitPrice: number;
}

export interface OrderTotals {
	subtotal: number;
	discount: number;
	discountPercent: number;
	bundleDiscountRolle: number;
	bundleDiscountBoerek: number;
	rolleBundleFreeCount: number;
	boerekBundleFreeCount: number;
	total: number;
	currency: string;
}

export interface PricedCart {
	items: PricedLine[];
	totals: OrderTotals;
}

const normalizeLabel = (value: string): string =>
	value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();

const assertPositiveInteger = (
	value: unknown,
	max: number,
	label: string,
): number => {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0 || parsed > max) {
		throw new HttpsError(
			"invalid-argument",
			`${label} must be a positive integer of at most ${max}.`,
		);
	}
	return parsed;
};

/**
 * Validates the shape of the browser-supplied cart lines. No prices here —
 * those are looked up in loadPricedCart.
 */
export const assertValidCartLines = (value: unknown): CartLineInput[] => {
	if (!Array.isArray(value) || value.length === 0) {
		throw new HttpsError("invalid-argument", "At least one item is required.");
	}

	if (value.length > MAX_LINES) {
		throw new HttpsError("invalid-argument", "Too many items in the cart.");
	}

	return value.map((entry) => {
		if (!entry || typeof entry !== "object") {
			throw new HttpsError("invalid-argument", "Order item is invalid.");
		}

		const line = entry as Record<string, unknown>;
		// Accept the legacy `id` key so older clients keep working.
		const rawId = line.productId ?? line.id;
		const productId = typeof rawId === "string" ? rawId.trim() : "";

		if (!productId) {
			throw new HttpsError(
				"invalid-argument",
				"Order item productId is required.",
			);
		}

		const result: CartLineInput = {
			productId,
			quantity: assertPositiveInteger(
				line.quantity ?? 1,
				MAX_QUANTITY,
				"Order item quantity",
			),
		};

		if (line.weightInGrams !== undefined && line.weightInGrams !== null) {
			result.weightInGrams = assertPositiveInteger(
				line.weightInGrams,
				MAX_WEIGHT_IN_GRAMS,
				"Order item weightInGrams",
			);
		}

		if (line.pieces !== undefined && line.pieces !== null) {
			result.pieces = assertPositiveInteger(
				line.pieces,
				MAX_PIECES,
				"Order item pieces",
			);
		}

		return result;
	});
};

interface CatalogProduct {
	name: string;
	price: number;
	priceUnit: string;
	active: boolean;
	categoryId?: string;
	imageUrl?: string | null;
}

const readCatalogProduct = (
	productId: string,
	data: Record<string, unknown> | undefined,
): CatalogProduct => {
	if (!data) {
		throw new HttpsError(
			"not-found",
			`Product ${productId} is no longer available.`,
		);
	}

	const price = Number(data.price);
	if (!Number.isFinite(price) || price < 0) {
		throw new HttpsError(
			"failed-precondition",
			`Product ${productId} has no valid price.`,
		);
	}

	return {
		name: typeof data.name === "string" ? data.name : productId,
		price,
		priceUnit: data.priceUnit === "100g" ? "100g" : "stueck",
		active: data.active === true,
		categoryId: typeof data.categoryId === "string" ? data.categoryId : undefined,
		imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : null,
	};
};

/**
 * Loads every referenced product from Firestore and prices the cart.
 * Throws if a product is missing, inactive or ordered in the wrong unit.
 */
export const loadPricedCart = async (
	db: Firestore,
	lines: CartLineInput[],
): Promise<PricedCart> => {
	const uniqueIds = Array.from(new Set(lines.map((line) => line.productId)));
	const productSnapshots = await db.getAll(
		...uniqueIds.map((id) => db.collection("products").doc(id)),
	);

	const productsById = new Map<string, CatalogProduct>();
	productSnapshots.forEach((snapshot, index) => {
		const productId = uniqueIds[index];
		const product = readCatalogProduct(
			productId,
			snapshot.exists ? snapshot.data() : undefined,
		);

		if (!product.active) {
			throw new HttpsError(
				"failed-precondition",
				`Product ${product.name} is no longer available.`,
			);
		}

		productsById.set(productId, product);
	});

	// Bundle deals key off the category name, so resolve the referenced ones.
	const categoryIds = Array.from(
		new Set(
			Array.from(productsById.values())
				.map((product) => product.categoryId)
				.filter((id): id is string => Boolean(id)),
		),
	);
	const categorySnapshots = categoryIds.length
		? await db.getAll(
			...categoryIds.map((id) => db.collection("categories").doc(id)),
		)
		: [];
	const categoryNameById = new Map<string, string>();
	categorySnapshots.forEach((snapshot, index) => {
		const categoryId = categoryIds[index];
		const name = snapshot.exists ? snapshot.data()?.name : undefined;
		categoryNameById.set(
			categoryId,
			typeof name === "string" ? name : categoryId,
		);
	});

	const items: PricedLine[] = lines.map((line) => {
		const product = productsById.get(line.productId)!;
		const category = product.categoryId
			? categoryNameById.get(product.categoryId) ?? product.categoryId
			: "";

		if (product.priceUnit === "100g") {
			if (!line.weightInGrams) {
				throw new HttpsError(
					"invalid-argument",
					`${product.name} is sold by weight — weightInGrams is required.`,
				);
			}

			const rawUnitPrice = (line.weightInGrams / 100) * product.price;
			return {
				id: line.productId,
				name: product.name,
				quantity: line.quantity,
				unitPrice: roundCurrency(rawUnitPrice),
				lineTotal: roundCurrency(rawUnitPrice * line.quantity),
				pricingUnit: "per_100g" as const,
				category,
				weightInGrams: line.weightInGrams,
				...(product.imageUrl ? {imageUrl: product.imageUrl} : {}),
				rawUnitPrice,
			};
		}

		if (!line.pieces) {
			throw new HttpsError(
				"invalid-argument",
				`${product.name} is sold per piece — pieces is required.`,
			);
		}

		const rawUnitPrice = product.price * line.pieces;
		return {
			id: line.productId,
			name: product.name,
			quantity: line.quantity,
			unitPrice: roundCurrency(rawUnitPrice),
			lineTotal: roundCurrency(rawUnitPrice * line.quantity),
			pricingUnit: "per_item" as const,
			category,
			pieces: line.pieces,
			...(product.imageUrl ? {imageUrl: product.imageUrl} : {}),
			rawUnitPrice,
		};
	});

	return {items, totals: calculateTotals(items)};
};

const piecesOf = (item: PricedLine): number =>
	item.pricingUnit === "per_item" && item.pieces ? item.pieces : item.quantity;

const pricePerPiece = (item: PricedLine): number =>
	item.pricingUnit === "per_item" && item.pieces && item.pieces > 0
		? roundCurrency(item.rawUnitPrice / item.pieces)
		: roundCurrency(item.rawUnitPrice / item.quantity);

const bundleDiscount = (items: PricedLine[], bundleSize: number) => {
	const totalPieces = items.reduce((sum, item) => sum + piecesOf(item), 0);
	const freeCount = Math.floor(totalPieces / bundleSize);
	const discount =
		freeCount > 0 && items.length > 0
			? roundCurrency(freeCount * Math.min(...items.map(pricePerPiece)))
			: 0;
	return {freeCount, discount};
};

/**
 * Mirrors the cart maths in app/context/CartContext.tsx: bundle deals and the
 * percentage tiers are computed independently and the better one wins.
 */
export const calculateTotals = (items: PricedLine[]): OrderTotals => {
	const subtotal = roundCurrency(
		items.reduce((sum, item) => sum + item.rawUnitPrice * item.quantity, 0),
	);

	const rolle = bundleDiscount(
		items.filter((item) => normalizeLabel(item.category) === "rolle"),
		ROLLE_BUNDLE_SIZE,
	);
	const boerek = bundleDiscount(
		items.filter((item) => normalizeLabel(item.name).includes("boerek")),
		BOEREK_BUNDLE_SIZE,
	);
	const totalBundleDiscount = roundCurrency(rolle.discount + boerek.discount);

	const rawDiscountPercent = subtotal > 100 ? 15 : subtotal > 50 ? 10 : 0;
	const percentDiscount = roundCurrency(subtotal * (rawDiscountPercent / 100));
	const useBundleDiscount = totalBundleDiscount >= percentDiscount;

	const discount = useBundleDiscount ? totalBundleDiscount : percentDiscount;

	return {
		subtotal,
		discount,
		discountPercent: useBundleDiscount ? 0 : rawDiscountPercent,
		bundleDiscountRolle: rolle.discount,
		bundleDiscountBoerek: boerek.discount,
		rolleBundleFreeCount: rolle.freeCount,
		boerekBundleFreeCount: boerek.freeCount,
		total: roundCurrency(subtotal - discount),
		currency: CURRENCY,
	};
};

export const assertMinimumOrder = (totals: OrderTotals): void => {
	if (totals.subtotal < MINIMUM_ORDER_SUBTOTAL) {
		throw new HttpsError(
			"failed-precondition",
			`The minimum order value is ${MINIMUM_ORDER_SUBTOTAL} ${CURRENCY}.`,
		);
	}
};

/** Strips the internal arithmetic field before the line is persisted. */
export const toStoredItem = (item: PricedLine) => {
	const {rawUnitPrice: _rawUnitPrice, ...stored} = item;
	return stored;
};
