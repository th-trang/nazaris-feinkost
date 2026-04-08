import {getApps, initializeApp} from "firebase-admin/app";
import {setGlobalOptions} from "firebase-functions";

setGlobalOptions({maxInstances: 10, region: "europe-west3", memory: "256MiB", cpu: 1});

if (!getApps().length) {
	initializeApp();
}
