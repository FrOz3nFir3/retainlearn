// Every migration, in the order they run (runner.js). A new one goes at the end.
import * as indexes from "./0001-indexes.js";
import * as studySetNames from "./0002-study-set-names.js";
import * as newCollections from "./0003-new-collections.js";

export default [indexes, studySetNames, newCollections];
