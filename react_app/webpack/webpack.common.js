const path = require('path');
const BundleTracker = require("webpack-bundle-tracker");

module.exports = {
    entry: './src/EngageIC4UApp.jsx',
    output: {
        path: path.resolve(__dirname, '../../static/js/react'), //output our build to static relative path
        filename: "[name].[contenthash].js",
        chunkFilename: '[name].bundle.[contenthash].js',
        clean: true,
    },
    optimization: {
        minimize: true, // minimize the js bundle
        splitChunks: {
            cacheGroups: {
                reactVendor: {
                    test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
                    name: 'vendor-react',
                    chunks: 'all',
                },
            },
        },
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,    // dont include node_modules for bundling
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                    {
                        loader: 'file-loader',
                    },
                ],
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: require.resolve('@svgr/webpack'),
                        options: {
                            prettier: false,
                            svgo: false,
                            svgoConfig: {
                                plugins: [{ removeViewBox: false }],
                            },
                            titleProp: true,
                            ref: true,
                        },
                    },
                    {
                        loader: require.resolve('file-loader'),
                        options: {
                            name: 'static/media/[name].[hash].[ext]',
                        },
                    },
                ],
                issuer: {
                    and: [/\.(js|jsx)$/],
                },
            },
        ],
    },
    resolve: {
        extensions: ['', '.js', '.jsx'],
    },
    plugins: [
        new BundleTracker({ path: '../static/js/react/', filename: 'webpack-stats.json' }),
    ]
};
