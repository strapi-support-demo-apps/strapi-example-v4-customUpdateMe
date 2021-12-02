module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '5f88045fb6faac4d17549a2843844a4c'),
  },
});
