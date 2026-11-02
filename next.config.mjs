/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === "development" ? "next-dev" : ".next",
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/api/send-email": ["./resumes/Devesh-Resume.pdf", "./resumes/fullstack-resume.pdf"],
  },
};

export default nextConfig;
