module.exports = {
  entry: {
    vendors: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-redux',
      'react-router-redux',
      'redux',
      'redux-logger',
      'whatwg-fetch'
    ]
  },
  plugins: [
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: ['react-hot-loader/webpack', 'babel-loader?cacheDirectory=true']
      }, {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'file-loader'
      }, {
        test: /\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader']
      }, {
        test: /\.(png|jpg)$/,
        use: 'url-loader?limit=8192'
      }
    ]
  }
};
