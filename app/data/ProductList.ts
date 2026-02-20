export interface Product {
  id: string;
  name: string;
  ingredients: string[];
  pricePerKg: number;
  image: string;
  category: string;
  isVegan: boolean;
}

export const products: Product[] = [
    {
      id: "1",
      name: "Hummus Klassik",
      ingredients: ["Kichererbsen", "Tahini", "Knoblauch", "Zitronensaft", "Olivenöl", "Kreuzkümmel", "Salz"],
      pricePerKg: 18.00,
      image: "https://images.unsplash.com/photo-1759679134771-835a874351fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxodW1tdXMlMjBib3dsJTIwbWVkaXRlcnJhbmVhbnxlbnwxfHx8fDE3NzA0ODUyMzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Dips & Aufstriche",
      isVegan: true,
    },
    {
      id: "2",
      name: "Falafel",
      ingredients: ["Kichererbsen", "Zwiebeln", "Petersilie", "Koriander", "Knoblauch", "Kreuzkümmel", "Salz", "Pfeffer"],
      pricePerKg: 22.00,
      image: "https://images.unsplash.com/photo-1550936831-46af2497cf61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYWxhZmVsJTIwcGxhdGUlMjB2ZWdhbnxlbnwxfHx8fDE3NzA0ODUyMzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Hauptgerichte",
      isVegan: true,
    },
    {
      id: "3",
      name: "Griechischer Salat",
      ingredients: ["Tomaten", "Gurken", "Paprika", "Zwiebeln", "Oliven", "Feta-Käse", "Olivenöl", "Oregano"],
      pricePerKg: 16.50,
      image: "https://images.unsplash.com/photo-1625944525991-c196b2813492?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlayUyMHNhbGFkJTIwZnJlc2h8ZW58MXx8fHwxNzcwNDY2ODAwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Salate",
      isVegan: false,
    },
    {
      id: "4",
      name: "Dolma",
      ingredients: ["Weinblätter", "Reis", "Zwiebeln", "Tomaten", "Petersilie", "Minze", "Olivenöl", "Zitronensaft"],
      pricePerKg: 24.00,
      image: "https://images.unsplash.com/photo-1621953723422-6023013f659d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2xtYSUyMHN0dWZmZWQlMjBncmFwZSUyMGxlYXZlc3xlbnwxfHx8fDE3NzA0ODUyMzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Vorspeisen",
      isVegan: true,
    },
    {
      id: "5",
      name: "Tabouleh",
      ingredients: ["Petersilie", "Bulgur", "Tomaten", "Zwiebeln", "Minze", "Zitronensaft", "Olivenöl", "Salz"],
      pricePerKg: 14.50,
      image: "https://images.unsplash.com/photo-1542528180-0c79567c66de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWJvdWxlaCUyMHNhbGFkJTIwcGFyc2xleXxlbnwxfHx8fDE3NzA0ODUyMzl8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Salate",
      isVegan: true,
    },
    {
      id: "6",
      name: "Baklava",
      ingredients: ["Filoteig", "Walnüsse", "Pistazien", "Butter", "Honig", "Zucker", "Zimt"],
      pricePerKg: 32.00,
      image: "https://images.unsplash.com/photo-1767796777227-32ef3200fab8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWtsYXZhJTIwcGFzdHJ5JTIwZGVzc2VydHxlbnwxfHx8fDE3NzAzODY4NTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Desserts",
      isVegan: false,
    },
    {
      id: "7",
      name: "Tzatziki",
      ingredients: ["Griechischer Joghurt", "Gurken", "Knoblauch", "Olivenöl", "Dill", "Zitronensaft", "Salz"],
      pricePerKg: 15.50,
      image: "https://images.unsplash.com/photo-1709620061649-b352f63ea4cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0emF0emlraSUyMHlvZ3VydCUyMGRpcHxlbnwxfHx8fDE3NzA0ODUyNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Dips & Aufstriche",
      isVegan: false,
    },
    {
      id: "8",
      name: "Marinierte Oliven",
      ingredients: ["Oliven", "Olivenöl", "Knoblauch", "Rosmarin", "Thymian", "Zitronenschale", "Chili"],
      pricePerKg: 19.50,
      image: "https://images.unsplash.com/photo-1657617836185-c3bceced415f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbGl2ZXMlMjBtYXJpbmF0ZWQlMjBib3dsfGVufDF8fHx8MTc3MDQ4NTI0M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Vorspeisen",
      isVegan: true,
    },
  ];