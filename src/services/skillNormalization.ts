const skillAliases = new Map([
    ['react', 'React'],
    ['reactjs', 'React'],
    ['react.js', 'React'],
    ['node', 'Node.js'],
    ['nodejs', 'Node.js'],
    ['node.js', 'Node.js'],
    ['html5', 'HTML'],
    ['html', 'HTML'],
    ['css3', 'CSS'],
    ['css', 'CSS'],
    ['javascript', 'JavaScript'],
    ['java', 'Java']
])

export function normalizeSkill(skill: string): string {
  const key = skill.trim().toLowerCase();

  return skillAliases.get(key) ?? skill.trim();
}
