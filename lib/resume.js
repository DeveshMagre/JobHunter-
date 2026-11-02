import { readFile } from "node:fs/promises";
import path from "node:path";

const RESUME_PATH = path.join(
  process.cwd(),
  "resumes",
);
const MAX_RESUME_SIZE = 4 * 1024 * 1024;

const RESUME_FILES = {
  react: { source: "Devesh-Resume.pdf", attachment: "Devesh-Resume.pdf" },
  fullstack: { source: "fullstack-resume.pdf", attachment: "Devesh-Magre-Resume.pdf" },
};

export class ResumeError extends Error {
  constructor(message) {
    super(message);
    this.name = "ResumeError";
    this.status = 400;
  }
}

export async function readPrivateResume(resumeType) {
  const resume = RESUME_FILES[resumeType];
  if (!resume) throw new ResumeError("Choose a valid resume type.");

  let contents;
  try {
    contents = await readFile(path.join(RESUME_PATH, resume.source));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }

  if (
    contents.length === 0 ||
    contents.length > MAX_RESUME_SIZE ||
    contents.subarray(0, 5).toString("ascii") !== "%PDF-"
  ) {
    throw new ResumeError(`${resume.source} is not a valid PDF under 4 MB.`);
  }

  return { name: resume.attachment, contents };
}
