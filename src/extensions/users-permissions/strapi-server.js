const _ = require('lodash');

module.exports = (plugin) => {
  const getController = name => {
    return strapi.plugins['users-permissions'].controller(name);
  };

  // Create the new controller
  plugin.controllers.user.updateMe = async (ctx) => {
    const user = ctx.state.user;

    // User has to be logged in to update themselves
    if (!user) {
      return ctx.unauthorized();
    }

    // Pick only specific fields for security
    const newData = _.pick(ctx.request.body, ['email', 'username', 'password', 'confirmPassword']);

    // Make sure there is no duplicate user with the same username
    if (newData.username) {
      const userWithSameUsername = await strapi
        .query('plugin::users-permissions.user')
        .findOne({ where: { username: newData.username } });

      if (userWithSameUsername && userWithSameUsername.id != user.id) {
        return ctx.badRequest('Username already taken');
      }
    }

    // Make sure there is no duplicate user with the same email
    if (newData.email) {
      const userWithSameEmail = await strapi
        .query('plugin::users-permissions.user')
        .findOne({ where: { email: newData.email.toLowerCase() } });

      if (userWithSameEmail && userWithSameEmail.id != user.id) {
        return ctx.badRequest('Email already taken');
      }
      newData.email = newData.email.toLowerCase();
    }

    // Check if user is changing password and make sure passwords match
    if (newData.password) {
      if (!newData.confirmPassword) {
        return ctx.badRequest('Missing password confirmation');
      } else if (newData.password !== newData.confirmPassword) {
        return ctx.badRequest('Passwords don\'t match')
      }
      delete newData.confirmPassword
    }

    // Reconstruct context so we can pass to the controller
    ctx.request.body = newData
    ctx.params = { id: user.id }

    // Update the user and return the sanitized data
    return await getController('user').update(ctx)
  };

  // Add the custom route
  plugin.routes['content-api'].routes.unshift({
    method: 'PUT',
    path: '/users/me',
    handler: 'user.updateMe',
    config: {
      prefix: ''
    }
  });

  return plugin;
};
