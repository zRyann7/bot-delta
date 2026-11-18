const isStaff = (member) => {
  if (!member) return false;

  const ownerIds = (process.env.OWNER_IDS || process.env.OWNER_ID || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (ownerIds.includes(member.id || member.user?.id)) {
    return true;
  }

  const staffIds = (process.env.IDS_CARGO_STAFF || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  return staffIds.some((id) => member.roles?.cache?.has(id));
};

module.exports = { isStaff };