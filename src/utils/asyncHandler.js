// this is used to stop any function until the server not give the response or request from browser and also give the errors if like network error.
// using promises or then...catch
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
    );
  };
};

export { asyncHandler };

// using try..catch
// asyncHandler is a higher order function. Higher order function is a function which can take function as a parameter and can return it.
// const asyncHandler = (fn) => { async () => {} } same as below. looks like function inside function.

// const asyncHandler = (requestHandler) => async (req, res, next) => {
//     try {
//        await requestHandler(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json(({
//             success: true,
//             message: error.message
//         }))
//     }
// }
