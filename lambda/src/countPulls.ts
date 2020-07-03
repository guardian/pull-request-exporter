import { countOpenPRs } from "./utils/counter";
import * as path from "path";

(() => {
  const file = process.argv[2];
  if (!file) {
    throw new Error("Please pass file path as argument");
  }
  countOpenPRs({ file: path.join(process.cwd(), file) });
})();
