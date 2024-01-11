const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = function (webpackEnv, { mode }) {
    // overrides for the webpack config for production
    const isEnvProduction = mode === "production";
    const env = dotenv.config({
        path: "../config/secrets/.env-react",
    }).parsed;
    return merge(common, {
        plugins: [
            new webpack.DefinePlugin({
                "process.env": {
                    // This has effect on the react library size
                    NODE_ENV: (isEnvProduction)
                        ? JSON.stringify("production")
                        : JSON.stringify('development'),
                    REACT_APP_BASE_API_URL: JSON.stringify(env.REACT_APP_BASE_API_URL),
                    REACT_APP_BASE_URL: JSON.stringify(env.REACT_APP_BASE_URL),
                    DEFAULT_FROM_EMAIL: JSON.stringify(env.DEFAULT_FROM_EMAIL),
                    WEBSOCKET_SERVER: JSON.stringify(env.WEBSOCKET_SERVER),
                },
            }),
        ],
    });
};
