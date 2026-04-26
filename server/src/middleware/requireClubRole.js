export function requireClubRole(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (req.user.role !== 'club' || req.user.status !== 'active') {
    return res.status(403).json({ error: 'club_forbidden' });
  }
  return next();
}
