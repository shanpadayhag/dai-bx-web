class AppError extends Error {
  readonly title: string;
  readonly description: string;

  constructor(title: string, description: string) {
    super(`${title}: ${description}`);
    this.name = 'AppError';
    this.title = title;
    this.description = description;
  }
}

export default AppError;
