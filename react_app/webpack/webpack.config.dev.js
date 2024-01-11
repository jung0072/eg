const webpack = require('webpack');
const path = require("path");
const { merge } = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const dotenv = require("dotenv");
const WriteFilePlugin = require('write-file-webpack-plugin');
const common = require('./webpack.common.js');

module.exports = function (webpackEnv, { mode }) {
    const env = dotenv.config({
        path: "../config/secrets/.env-react",
    }).parsed;
    const djangoServer = env.DJANGO_SERVER_NAME

    return merge(common, {
        target: 'web',
        mode: 'development',
        devtool: 'inline-source-map',
        output: {
            publicPath: path.resolve(__dirname, '../../static/js/react'),
        },
        devServer: {
            open: true,
            client: {
                logging: "info",
                overlay: true,
                progress: true,
            },
            port: 9999,
            static: path.resolve(__dirname, '../../static/'),
            hot: true,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            },
            compress: true,
            devMiddleware: {
                index: false, // specify to enable root proxying
                writeToDisk: true,
                publicPath: path.resolve(__dirname, '../../static/js/react'),
            },
            proxy: [{
                context: () => true,
                target: djangoServer,
                changeOrigin: true,
            }],
            allowedHosts: "all"
        },
        plugins: [
            new HtmlWebpackPlugin({
                title: 'Hot Module Replacement',
            }),
            //This line writes the file on each hot reload
            new WriteFilePlugin(),
            new webpack.DefinePlugin({
                "process.env": {
                    // This has effect on the react library size
                    NODE_ENV: JSON.stringify('development'),
                    REACT_APP_BASE_API_URL: JSON.stringify(env.REACT_APP_BASE_API_URL),
                    REACT_APP_BASE_URL: JSON.stringify(env.REACT_APP_BASE_URL),
                    DEFAULT_FROM_EMAIL: JSON.stringify(env.DEFAULT_FROM_EMAIL),
                    WEBSOCKET_SERVER: JSON.stringify(env.WEBSOCKET_SERVER),
                },
            }),
        ],
    });
};
