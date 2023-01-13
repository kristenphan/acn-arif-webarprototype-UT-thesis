const path = require("path");

module.exports = {
  mode: "development",
  entry: {
    index: "/src/index.js", 
    waterme: "/src/waterme.js"
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].bundle.js"
  },
  devServer: {
    static: "./"
  },
  // Give performance warnings when entry point and output assets execeed a file size limit in bytes
  performance: {
    maxEntrypointSize: 1024000,
    maxAssetSize: 1024000
  },
  // Configure Babel transpiler to transpile all .js files except for those in node_modules using babel-loader
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  }
}