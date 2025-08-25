const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      background: './src/background/background.ts',
      popup: ['./src/popup/popup.ts', './src/popup/popup.css'],
      'content-naukri': ['./src/content/content-naukri.ts', './src/content/content-styles.css'],
      'content-linkedin': ['./src/content/content-linkedin.ts', './src/content/content-styles.css']
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true
    },
    

    
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: [
            /node_modules/,
            /__tests__/,
            /\.test\./,
            /\.spec\./
          ]
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            filename: 'icons/[name][ext]'
          }
        }
      ]
    },
    
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@popup': path.resolve(__dirname, 'src/popup'),
        '@background': path.resolve(__dirname, 'src/background'),
        '@content': path.resolve(__dirname, 'src/content'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@types': path.resolve(__dirname, 'src/types'),
        '@utils': path.resolve(__dirname, 'src/utils')
      }
    },
    
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'manifest.json',
            to: 'manifest.json'
          },
          {
            from: 'src/icons',
            to: 'icons',
            noErrorOnMissing: true
          }
        ]
      }),
      
      new HtmlWebpackPlugin({
        template: './src/popup/popup.html',
        filename: 'popup.html',
        chunks: ['popup']
      }),
      
      new MiniCssExtractPlugin({
        filename: '[name].css'
      })
    ],
    
    devtool: isProduction ? false : 'cheap-module-source-map',
    
    optimization: {
      minimize: isProduction
    },
    
    // Extension-specific configurations
    target: 'web',
    
    // Disable webpack's default splitting for extensions
    optimization: {
      splitChunks: false
    }
  };
};