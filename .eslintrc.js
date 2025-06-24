module.exports = {
  root: true,
  extends: [
    '@react-native-community',
    'prettier'
  ],
  plugins: ['react', 'react-native'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'prettier/prettier': 0,
    'react-native/no-inline-styles': 0,
    'no-shadow': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react/prop-types': 0,
    'react/react-in-jsx-scope': 0,
  },
  env: {
    'react-native/react-native': true,
  },
}; 