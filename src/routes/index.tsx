import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

// The whole project is a plain HTML/CSS/JS website living in the `public/` folder.
// Opening "/" simply sends the visitor to public/index.html (the Home page).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Event Portal | RCPIT Shirpur" },
      {
        name: "description",
        content:
          "Smart Event Certificate Generator and Verification Portal for college events at RCPIT Shirpur.",
      },
      { property: "og:title", content: "Smart Event Portal | RCPIT Shirpur" },
      {
        property: "og:description",
        content:
          "Register for college events and get your participation certificate instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/index.html" }],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("/index.html");
  }, []);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", textAlign: "center" }}>
      <p>
        Opening the Smart Event Portal… <a href="/index.html">Click here</a> if it does
        not open automatically.
      </p>
    </div>
  );
}
