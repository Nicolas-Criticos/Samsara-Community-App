export function memberDisplayName(member) {
  const n = member?.name?.trim();
  if (n) return n;
  if (member?.username) return member.username;
  return "Member";
}

export function bubbleMemberKey(member, index) {
  if (member.id != null) return String(member.id);
  if (member.user_id != null) return `u-${member.user_id}`;
  return `i-${index}`;
}
