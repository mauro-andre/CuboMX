import { CuboMX } from "cubomx";
import { themeHandler } from "./theme-handler";
import { nav } from "./nav";
import { codeBlock } from "./code";
import { cart } from "./cart";

CuboMX.store("themeHandler", themeHandler);
CuboMX.component("nav", nav);
CuboMX.component("codeBlock", codeBlock);
CuboMX.component("cart", cart);

CuboMX.start();
