import createMDX from "@next/mdx";

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
});

export default withMDX(config);