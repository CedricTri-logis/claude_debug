# Claude Debug Infrastructure Project Overview

## Purpose
This is a complete debugging infrastructure project with comprehensive error tracking and logging capabilities. It integrates Sentry for error monitoring and Logflare for centralized logging, providing a robust observability layer for Node.js applications.

## Tech Stack
- **Runtime**: Node.js 18+ (ES Modules)
- **Language**: JavaScript (ES6+)
- **Error Tracking**: Sentry (@sentry/node, @sentry/nextjs)
- **Logging**: Pino with Logflare integration (pino, pino-logflare)
- **Database**: PostgreSQL with pg driver, Supabase support
- **HTTP Client**: Axios
- **Testing**: Jest with coverage support
- **Development Tools**: ESLint, Prettier, TypeScript (for types)
- **Other**: UUID generation, dotenv for environment configuration

## Key Features
- Integrated logging and error tracking system
- Correlation ID support for distributed tracing
- Performance monitoring and tracking
- Database query logging
- API call logging and monitoring
- Security event tracking
- Graceful shutdown handling
- Comprehensive error context capture

## Project Type
This appears to be a library/framework for debugging and observability that can be integrated into other applications, particularly useful for production debugging with Sentry and Logflare integration.