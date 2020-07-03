import { countOpenPRs } from "./utils/counter";
import * as path from "path";

(() => {
  const file = process.argv[2];
  if (file) {
    console.log();
    countOpenPRs(path.join(process.cwd(), file));
  } else {
    countOpenPRs();
  }
})();
