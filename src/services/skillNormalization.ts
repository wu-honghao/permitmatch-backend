const skillAliases = new Map<string, string>([
  // Frontend
  ['react', 'React'],
  ['reactjs', 'React'],
  ['react.js', 'React'],
  ['vue', 'Vue.js'],
  ['vuejs', 'Vue.js'],
  ['vue.js', 'Vue.js'],
  ['angular', 'Angular'],
  ['typescript', 'TypeScript'],
  ['ts', 'TypeScript'],
  ['javascript', 'JavaScript'],
  ['js', 'JavaScript'],
  ['html', 'HTML'],
  ['html5', 'HTML'],
  ['css', 'CSS'],
  ['css3', 'CSS'],
  ['next.js', 'Next.js'],
  ['nextjs', 'Next.js'],

  // Backend
  ['node', 'Node.js'],
  ['nodejs', 'Node.js'],
  ['node.js', 'Node.js'],
  ['express', 'Express.js'],
  ['expressjs', 'Express.js'],
  ['express.js', 'Express.js'],
  ['java', 'Java'],
  ['spring boot', 'Spring Boot'],
  ['springboot', 'Spring Boot'],
  ['python', 'Python'],
  ['c#', 'C#'],
  ['c++', 'C++'],
  ['.net', '.NET'],
  ['dotnet', '.NET'],

  // Database
  ['mongodb', 'MongoDB'],
  ['mongo', 'MongoDB'],
  ['postgresql', 'PostgreSQL'],
  ['postgres', 'PostgreSQL'],
  ['mysql', 'MySQL'],
  ['redis', 'Redis'],

  // Cloud / DevOps
  ['aws', 'AWS'],
  ['amazon web services', 'AWS'],
  ['azure', 'Azure'],
  ['microsoft azure', 'Azure'],
  ['gcp', 'Google Cloud'],
  ['google cloud platform', 'Google Cloud'],
  ['docker', 'Docker'],
  ['kubernetes', 'Kubernetes'],
  ['k8s', 'Kubernetes'],
  ['ci/cd', 'CI/CD'],
  ['cicd', 'CI/CD'],
  ['git', 'Git'],

  // Testing
  ['jest', 'Jest'],
  ['vitest', 'Vitest'],
  ['playwright', 'Playwright'],
  ['cypress', 'Cypress'],

  // Data Engineering
  ['apache airflow', 'Airflow'],
  ['airflow', 'Airflow'],
  ['amazon redshift', 'Redshift'],
  ['redshift', 'Redshift'],
  ['dynamodb', 'DynamoDB'],
  ['amazon dynamodb', 'DynamoDB'],
  ['aws glue', 'AWS Glue'],
  ['amazon s3', 'Amazon S3'],
  ['aws s3', 'Amazon S3'],
  ['s3', 'Amazon S3']
]);

export function normalizeSkill(skill: string): string {
  const key = skill.trim().toLowerCase();

  return skillAliases.get(key) ?? skill.trim();
}

export const normalizeGroup = (skills: string[]) => {
  return [...new Set(skills.map(normalizeSkill))]
    .sort()
    .join("|");
};