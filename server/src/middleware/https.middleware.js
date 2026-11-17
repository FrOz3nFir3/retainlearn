// In production, a request that arrived over plain HTTP is sent to the HTTPS address and goes no further (P0-11).
// The redirect used to be sent and then the request carried on to its route as well.
export function redirectToHttps(req, res, next) {
  if (req.secure) return next();
  return res.redirect("https://" + req.headers.host + req.url);
}
