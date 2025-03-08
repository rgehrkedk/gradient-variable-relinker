const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',

  // This is the main entry point for the plugin code
  entry: {
    code: './src/main.ts', // Plugin code
    ui: './src/ui.js', // UI code - we'll create this empty file to satisfy webpack
  },

  module: {
    rules: [
      // Handle TypeScript files
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true, // Skip type checking for faster builds
            }
          }
        ],
        exclude: /node_modules/,
      },
    ],
  },

  // Extensions to resolve
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },

  // Generate source maps to help with debugging
  devtool: argv.mode === 'production' ? false : 'inline-source-map',

  plugins: [
    // Generate the UI HTML file
    new HtmlWebpackPlugin({
      template: './src/ui.html',
      filename: 'ui.html',
      inject: false,
    }),
  ],
});