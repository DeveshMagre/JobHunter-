const SIGN_OFF = "Best Regards,\nDevesh Magre\n7089002451\ndeveshmagre1@gmail.com";

export const EMAIL_TEMPLATES = [
  {
    id: "template-1",
    label: "Template 1",
    create: ({ company, jobRole }) => ({
      subject: "Application for React Developer | 2+ Years of Experience",
      body: `Dear Hiring Team,\n\nI am interested in applying for the ${jobRole} position at ${company}.\n\nI have 2+ years of experience in frontend development, with hands-on expertise in JavaScript, React.js, Next.js, HTML, CSS, and REST API integration.\n\nI have experience building responsive web applications, interactive dashboards, reusable components, and integrating REST APIs.\n\nI am actively looking for new opportunities and would be glad to discuss how my skills and experience can add value to your team.\n\nPlease review my attached resume and feel free to contact me directly at your convenience to schedule an interview.\n\nPortfolio: https://magnificent-liger-06bb8f.netlify.app\nLinkedIn: https://www.linkedin.com/in/devesh-magre-003924283\nGitHub: https://github.com/DeveshMagre\n\nThank you for your time and consideration.\n\n\n${SIGN_OFF}`,
    }),
  },
  {
    id: "template-2",
    label: "Template 2",
    create: ({ company, jobRole }) => ({
      subject: "Application for Full Stack Developer(MERN) | 2+ Years of Experience",
      body: `Dear Hiring Team,\n\nI am writing to apply for the ${jobRole} position at ${company}.\n\nI have 2+ years of experience in web development, with hands-on expertise in MongoDB, Express.js, React.js, Node.js, JavaScript, Next.js, and REST API development.\n\nI have experience building responsive web applications, developing backend APIs, integrating databases, implementing authentication, and creating reusable frontend components.\n\nI am actively looking for new opportunities and would welcome the opportunity to discuss how my skills and experience can add value to your team.\n\nPlease find my resume attached for your consideration. I would appreciate the opportunity to discuss my profile in an interview. Feel free to contact me directly to schedule a call.\n\nPortfolio: https://magnificent-liger-06bb8f.netlify.app\nLinkedIn: https://www.linkedin.com/in/devesh-magre-003924283\nGitHub: https://github.com/DeveshMagre\n\nThank you for your time and consideration.\n\n\n${SIGN_OFF}`,
    }),
  },
];

export function getTemplate(templateId) {
  return EMAIL_TEMPLATES.find((template) => template.id === templateId);
}

export function getTemplateForResumeType(resumeType) {
  const templateId = {
    react: "template-1",
    fullstack: "template-2",
  }[resumeType];
  return templateId ? getTemplate(templateId) : undefined;
}
