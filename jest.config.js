/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

// const esModules = ['axios'].join('|');
const CI = process.env.CI === 'true';

const reporters = ['default'];

if (CI) {
  reporters.push('jest-junit');
}


module.exports = {
  reporters,
  preset: 'ts-jest/presets/js-with-ts',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.test.[jt]sx?$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};
