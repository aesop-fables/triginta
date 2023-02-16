// import middy from '@middy/core';
// import xss from 'xss';

// export const errorWrapper = () => ({
//   onError: (handler: middy.MiddyfiedHandler, next: middy.MiddlewareFn) => {
//     if (handler.error) {
//       handler.response = {
//         statusCode: 400,
//         headers: {
//           'Content-Type': 'application/json',
//           'Access-Control-Allow-Origin': '*',
//           'Access-Control-Allow-Headers': '*',
//           'Access-Control-Allow-Methods': '*',
//         },
//         body: JSON.stringify({
//           error: handler.error,
//         }),
//       };

//       return next();
//     }

//     return next(handler.error);
//   },
// });

// export const convertNullTo200 = () => ({
//   after: (handler: middy.HandlerLambda, next: middy.NextFunction) => {
//     if (handler.response === null) {
//       handler.response = {
//         statusCode: 200,
//         headers: {
//           'Content-Type': 'application/json',
//           'Access-Control-Allow-Origin': '*',
//           'Access-Control-Allow-Headers': '*',
//           'Access-Control-Allow-Methods': '*',
//         },
//         body: '',
//       };
//     }

//     return next();
//   },
// });

// export const xssFilter = () => ({
//   before: async (handler: middy.HandlerLambda) => {
//     const { event } = handler;
//     const { body } = event;

//     if (body) {
//       const keys = Object.keys(body);
//       for (let i = 0; i < keys.length; i++) {
//         const key = keys[i];
//         const value = body[key];
//         if (value && typeof value === 'string') {
//           body[key] = xss(value);
//         }
//       }
//     }
//   },
// });
