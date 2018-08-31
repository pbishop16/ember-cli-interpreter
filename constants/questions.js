const createAppQuestions = [
  {
    type: 'expand',
    name: 'toCreateEmberApp',
    message: 'Would you like to create a new Ember application?',
    choices: [
      {
        key: 'y',
        name: 'Create Ember app',
        value: 'create',
      },
      {
        key: 'n',
        name: 'Do not create an Ember app',
        value: 'do not create',
      },
    ],
  },
  {
    type: 'input',
    name: 'appName',
    message: 'Please enter the desired app name:',
    when: (answers) => {
      return answers.toCreateEmberApp === 'create';
    }
  }
];

module.exports = {
  createAppQuestions,
};
