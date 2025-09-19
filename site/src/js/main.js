import { CuboMX } from "cubomx";
import { themeHandler } from "./theme-handler";
import { nav } from "./nav";
import { codeBlock } from "./code";

CuboMX.store("themeHandler", themeHandler);
CuboMX.component("nav", nav);
CuboMX.component("codeBlock", codeBlock);

CuboMX.start();
