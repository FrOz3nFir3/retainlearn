// /api/paths: paths (P2-07). The lists, a path's page and its history for everyone (a private path for its editors
// only); everything else for whoever's signed in.
import { Router } from "express";
import { requireAuthenticationWithCSRF } from "#middleware/auth.middleware.js";
import { validate } from "#middleware/validate.ts";
import { jsonErrors } from "#middleware/routeHelpers.ts";
import {
  acceptSuggestion,
  declineInput,
  declineSuggestion,
  deleteEditor,
  deleteFollow,
  deletePathRoute,
  deleteSuggestionRoute,
  editInput,
  editorAddInput,
  editorInput,
  followInput,
  getHistory,
  getPath,
  getPaths,
  getSuggestions,
  historyInput,
  newPathInput,
  pathInput,
  pathsInput,
  postCopy,
  postEditor,
  postPath,
  postReport,
  postSkill,
  postTestOut,
  putFollow,
  putPath,
  putSuggestionRoute,
  reportInput,
  skillInput,
  suggestInput,
  suggestionInput,
  testOutInput,
} from "./paths.controller.ts";

const pathsRouter = Router();
const signedIn = requireAuthenticationWithCSRF;

pathsRouter.get("/", validate(pathsInput), getPaths);
pathsRouter.post("/", signedIn, validate(newPathInput), postPath);
pathsRouter.get("/:id", validate(pathInput), getPath);
pathsRouter.put("/:id", signedIn, validate(editInput), putPath);
pathsRouter.delete("/:id", signedIn, validate(pathInput), deletePathRoute);
pathsRouter.post("/:id/copy", signedIn, validate(pathInput), postCopy);
pathsRouter.put("/:id/follow", signedIn, validate(followInput), putFollow);
pathsRouter.delete("/:id/follow", signedIn, validate(pathInput), deleteFollow);
pathsRouter.post("/:id/editors", signedIn, validate(editorAddInput), postEditor);
pathsRouter.delete("/:id/editors/:userId", signedIn, validate(editorInput), deleteEditor);
pathsRouter.get("/:id/suggestions", signedIn, validate(pathInput), getSuggestions);
pathsRouter.put("/:id/suggestions/mine", signedIn, validate(suggestInput), putSuggestionRoute);
pathsRouter.delete("/:id/suggestions/mine", signedIn, validate(pathInput), deleteSuggestionRoute);
pathsRouter.post("/:id/suggestions/:suggestionId/accept", signedIn, validate(suggestionInput), acceptSuggestion);
pathsRouter.post("/:id/suggestions/:suggestionId/decline", signedIn, validate(declineInput), declineSuggestion);
pathsRouter.get("/:id/history", validate(historyInput), getHistory);
pathsRouter.post("/:id/steps/:stepId/test-out", signedIn, validate(testOutInput), postTestOut);
pathsRouter.post("/:id/skill", signedIn, validate(skillInput), postSkill);
pathsRouter.post("/:id/report", signedIn, validate(reportInput), postReport);
pathsRouter.use(jsonErrors);

export default pathsRouter;
