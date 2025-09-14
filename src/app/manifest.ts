import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Pariti - Sharing stuff made simple",
		short_name: "Pariti",
		description: "A money sharing app for groups and friends",
		start_url: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#000000",
		icons: [
			{
				src: "/logo-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/logo-512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
	};
}
