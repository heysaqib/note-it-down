import { withAuth } from "next-auth/middleware";

export default withAuth(
  function proxy(req) {
    // optional custom logic
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/api/notes/:path*"],
};