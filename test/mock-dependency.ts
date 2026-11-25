// Isolate the original constructor smoke tests from the real database and SMTP.
export function mockDependency(token: any) {
  if (token?.name === 'ConfigService') {
    const values: Record<string, unknown> = {
      id: 'test', domain: 'localhost', NODE_ENV: 'test', REFRESH_COOKIE: 'refresh',
      'jwt.refresh.time': 60, jwt: { access: {}, refresh: { time: 60 } },
      emailService: { jsonTransport: true, auth: { user: 'test@example.com' } },
    };
    return { get: (key: string) => values[key] };
  }
  return {};
}
