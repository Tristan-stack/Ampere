# Energy Monitoring Dashboard

This is a sophisticated energy monitoring dashboard built with modern web technologies, designed to provide real-time insights into energy consumption and production data.

## Features

- **Real-time Monitoring**: Track energy usage and production data in real-time
- **Interactive Data Visualization**: Multiple chart types and visualizations for data analysis
- **Multi-level Access**: Role-based access control with different permission levels
- **Weather Integration**: Built-in weather data integration for contextual analysis
- **Interactive Building Map**: Floor-by-floor and building-wide energy monitoring
- **Administrative Tools**: User management and system configuration capabilities
- **Chat Interface**: Built-in chat functionality for team communication
- **Responsive Design**: Mobile-friendly interface using modern UI components

## Tech Stack

This project leverages the following technologies:

- [Next.js](https://nextjs.org) - React framework for production
- [NextAuth.js](https://next-auth.js.org) - Authentication system
- [Prisma](https://prisma.io) - Database ORM
- [tRPC](https://trpc.io) - End-to-end typesafe APIs
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- Socket.IO - Real-time data updates
- [shadcn/ui](https://ui.shadcn.com/) - Modern UI component library

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up your environment variables:
```bash
cp .env.example .env
```
4. Initialize the database:
```bash
npm run db:push
```
5. Start the development server:
```bash
npm run dev
```

## Project Structure

- `/src/app` - Application pages and route handlers
- `/src/components` - Reusable React components
- `/src/server` - Backend API and database configuration
- `/src/styles` - Global styles and Tailwind configuration
- `/prisma` - Database schema and migrations

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Prisma Documentation](https://prisma.io/docs)
- [tRPC Documentation](https://trpc.io)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Deployment

This application can be deployed on any platform that supports Next.js applications. For detailed deployment instructions, refer to:

- [Vercel Deployment Guide](https://create.t3.gg/en/deployment/vercel)
- [Docker Deployment Guide](https://create.t3.gg/en/deployment/docker)
- [Netlify Deployment Guide](https://create.t3.gg/en/deployment/netlify)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
