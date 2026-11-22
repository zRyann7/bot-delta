const lerIds = (valor) =>
  (valor || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

const isStaff = (member) => {
  if (!member) return false;

  const donos = lerIds(process.env.OWNER_IDS || process.env.OWNER_ID);
  if (donos.includes(member.id || member.user?.id)) return true;

  const cargosStaff = lerIds(process.env.IDS_CARGO_STAFF);
  return cargosStaff.some((id) => member.roles?.cache?.has(id));
};

const autorEhStaff = async (message) => {
  const member =
    message.member ||
    (await message.guild.members.fetch(message.author.id).catch(() => null));
  return isStaff(member);
};

module.exports = { isStaff, autorEhStaff };
