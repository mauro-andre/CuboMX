import { CuboMX } from "cubomx";
import { themeHandler } from "./theme-handler";
import { nav } from "./nav";

CuboMX.store("themeHandler", themeHandler);
CuboMX.component("nav", nav);

CuboMX.start();
