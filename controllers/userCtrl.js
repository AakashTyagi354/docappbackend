const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const doctorModel = require("../models/docModel");
const appointmentModel = require("../models/appoinmentModel");
const moment = require("moment");

// register
const registerController = async (req, res) => {
  try {
    const exisitingUser = await userModel.findOne({ email: req.body.email });
    if (exisitingUser) {
      return res
        .status(200)
        .send({ message: "User Already Exist", success: false });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
    const newUser = new userModel(req.body);
    await newUser.save();
    res.status(201).send({ message: "Register Sucessfully", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `Register Controller ${error.message}`,
    });
  }
};

// login
const adminLogin = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(200).send({
        success: false,
        message: "User Not Exist",
      });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(200).send({
        success: false,
        message: "Invalid Email or  Password",
      });
    }
    if (user.isAdmin === false) {
      return res.status(200).send({
        success: false,
        message: "You are not admin",
      });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1D",
    });
    res.status(200).send({
      success: true,
      message: "Login Sucessfully",
      user,
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: `Login Controller ${err.message}`,
    });
  }
};

// login
const loginCtrl = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(200).send({
        success: false,
        message: "User Not Exist",
      });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(200).send({
        success: false,
        message: "Invalid Email or  Password",
      });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1D",
    });
    res.status(200).send({
      success: true,
      message: "Login Sucessfully",
      user,
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: `Login Controller ${err.message}`,
    });
  }
};

// get doctors
const getDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({ status: "approved" });
    res
      .status(201)
      .send({ message: "All doctors available", success: true, doctors });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: `error in fetching all doctores for user ${err.message}`,
    });
  }
};

const authCtrl = async (req, res) => {
  try {
    const user = await userModel.findById({ _id: req.body.userId });
    user.password = undefined;
    if (!user) {
      return res.status(200).send({
        success: false,
        message: "User Not Exist",
      });
    } else {
      res.status(200).send({
        success: true,
        data: user,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: `auth Controller ${err.message}`,
    });
  }
};

// apply doc
const applyDoctorCtrl = async (req, res) => {
  try {
    // Hash the password
    const doc = await doctorModel.findOne({ email: req.body.email });
    if (doc) {
      return res.status(200).send({
        success: false,
        message: "doc already exists",
      });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new doctor document with the hashed password
    const doctorData = {
      ...req.body,
      password: hashedPassword,
      status: "pending",
    };
    const doctor = new doctorModel(doctorData);
    await doctor.save();

    // Update admin's notification
    const adminUser = await userModel.findOne({ isAdmin: true });
    adminUser.notification.push({
      type: "apply-doctor-request",
      message: `${doctor.firstName} ${doctor.lastName} has applied for a doctor account`,
      data: {
        doctorId: doctor._id,
        name: doctor.firstName + " " + doctor.lastName,
        onClickPath: "/admin/doctors",
      },
    });
    await adminUser.save();

    // Send success response
    res
      .status(201)
      .send({ message: "Doctor registration successful", success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      success: false,
      message: `Failed to apply as a doctor: ${err.message}`,
    });
  }
};

// const applyDoctorCtrl = async (req, res) => {
//   try {
//     const newDoctor = await doctorModel({ ...req.body, status: "pendling" });
//     await newDoctor.save();
//     const adminUser = await userModel.findOne({ isAdmin: true });
//     const notification = adminUser.notification;

//     const password = req.body.password;
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);
//     req.body.password = hashedPassword;
//     const doctor = new doctorModel(req.body);
//     await doctor.save();

//     res.status(201).send({ message: "Register Sucessfully", success: true });
//     notification.push({
//       type: "apply-doctor-request",
//       message: `${newDoctor.firstName} ${newDoctor.lastName} has applied for doc account`,
//       data: {
//         doctorId: newDoctor._id,
//         name: newDoctor.firstName + " " + newDoctor.lastName,
//         onClickPath: "/admin/doctors",
//       },
//     });
//     await userModel.findByIdAndUpdate(adminUser._id, { notification });
//     res
//       .status(201)
//       .send({ message: "Apply Doctor Sucessfully", success: true });
//   } catch (err) {
//     console.log(err);
//     res.status(500).send({
//       success: false,
//       message: `apply doc  ${err.message}`,
//     });
//   }
// };

// notification ctrl

const getAllNotificationCtrl = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.body.userId });
    // const seennotification = user.seennotification;
    const notification = user.notification;
    // seennotification.push(...notification);
    // user.notification = [];
    // user.seennotification = notification;

    // const updatedUser = await user.save();
    res.status(200).send({
      success: true,
      message: "all notification marked as read",
      notification,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: `getAllNotificationCtrl error ${err.message}`,
    });
  }
};

const deleteAllNotificationCtrl = async (req, res) => {
  try {
    // const user = await userModel.findOne({ _id: req.body.userId });
    // user.notification = [];
    // user.seennotification = [];
    // const updatedUser = await user.save();
    // updatedUser.password = undefined;
    // res.status(200).send({
    //   success: true,
    //   message: "all notification deleted ",
    //   data: updatedUser,
    // });

    const user = await userModel.findOne({ _id: req.body.userId });

    // Remove the notification at the specified index
    user.notification.splice(req.body.idx, 1);

    // Save the updated user
    const updatedUser = await user.save();
    updatedUser.password = undefined;

    res.status(200).send({
      success: true,
      message: "Notification deleted successfully",
      data: updatedUser.notification,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: `deleteAllNotificationCtrl error ${err.message}`,
    });
  }
};

const clearAllNotification = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.body.userId });

    // Remove the notification at the specified index
    user.notification = [];

    // Save the updated user
    const updatedUser = await user.save();
    updatedUser.password = undefined;

    // Log the updated user object
    console.log(updatedUser);

    res.status(200).send({
      success: true,
      message: "Notification deleted successfully",
      data: updatedUser.notification,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: `deleteAllNotificationCtrl error ${err.message}`,
    });
  }
};

// get all doc
const getAllDoctorsCtrl = async (req, res) => {
  try {
    const doctors = await doctorModel.find({ status: "approved" });
    res.status(200).send({
      success: true,
      data: doctors,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: `getAllDoctorsCtrl error ${err.message}`,
    });
  }
};

// book apoinment
const bookAppointmentCtrl = async (req, res) => {
  try {
    console.log("Date", req.body.date);
    console.log("Time", req.body.time);
    // req.body.date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    // req.body.time = moment(req.body.time, "HH:mm").toISOString();
    req.body.status = "pending";
    const exisitingAppointment = await appointmentModel.findOne({
      userId: req.body.userId,
      doctorId: req.body.doctorId,
    });
    if (exisitingAppointment) {
      return res.status(200).send({
        success: false,
        message: "Appointment booked already only allowed once at a time",
      });
    }
    const newAppointment = new appointmentModel(req.body);
    await newAppointment.save();
    console.log(req.body);
    // const user = await userModel.findOne({ _id: req.body.doctorInfo.userId });
    // user.notification.push({
    //   type: "New-Appointment-Request",
    //   message: `a new appoinment request from ${req.body.userInfo.name}`,
    //   onClickPath: "/user/appoinments",
    // });
    // await user.save();

    const user = await userModel.findOne({ _id: req.body.userId });
    user.notification.push({
      type: "New-Appointment-Request",
      message: `a new appoinment request with Dr. ${req.body.doctorInfo} has been created`,
      onClickPath: "/user/appoinments",
    });
    await user.save();

    // const doctor = await doctorModel.findOne({ _id: req.body.doctorId });
    // doctor.notification.push({
    //   type: "New-Appointment-Request",
    //   message: `a new appoinment request from  ${req.body.userInfo} has been created`,
    //   onClickPath: "/user/appoinments",
    // });
    // await doctor.save();
    res.status(200).send({
      success: true,
      message: "appoinment booked successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: `bookAppointmentCtrl error ${err.message}`,
    });
  }
};

// booking available
const bookingAvailiblityCtrl = async (req, res) => {
  console.log("hello", req.body);
  try {
    const exisitingAppointment = await appointmentModel.findOne({
      userId: req.body.userId,
      doctorId: req.body.doctorId,
      date: req.body.date,
      time: req.body.time,
    });
    console.log(exisitingAppointment);
    if (exisitingAppointment) {
      return res.status(200).send({
        success: false,
        message: "Appointment Already Booked",
      });
    } else {
      return res.status(200).send({
        success: true,
        message: "Appointment Available",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: `bookingAvailiblityCtrl error ${err.message}`,
    });
  }
};

// ao appointment list
const userAppointmentsCtrl = async (req, res) => {
  try {
    const appointment = await appointmentModel.find({
      userId: req.body.userId,
    });
    res.status(200).send({
      success: true,
      data: appointment,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: `userAppointmentsCtrl error ${err.message}`,
    });
  }
};

// update appointment with roomid
const updateAppoitment = async (req, res) => {
  try {
    const appointment = await appointmentModel.find({
      userId: req.body.userId,
    });
    res.status(200).send({
      success: true,
      data: appointment,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: `userAppointmentsCtrl error ${err.message}`,
    });
  }
};

module.exports = {
  loginCtrl,
  registerController,
  authCtrl,
  applyDoctorCtrl,
  getAllNotificationCtrl,
  deleteAllNotificationCtrl,
  getAllDoctorsCtrl,
  bookAppointmentCtrl,
  bookingAvailiblityCtrl,
  userAppointmentsCtrl,
  getDoctors,
  adminLogin,
  updateAppoitment,
  clearAllNotification,
};
