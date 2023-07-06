const router = require("express").Router();
const { Users } = require("../db");
const { createAccessToken } = require("../middlewares/jwt");
const jwt = require("jsonwebtoken");
const transporter = require("../middlewares/nodemailer");
const bcrypt = require("bcryptjs");

require("dotenv").config();
const { JWT_SECRET } = process.env;

// ESTA FUNCION ESTA EN PROCESO

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "The email is require" });
    } else {
      const oldUser = await Users.findOne({
        where: {
          email: email,
        },
      });

      if (!oldUser) {
        return res.status(404).send("The user not exists");
      } else {
        const token = await createAccessToken({
          id: oldUser.id,
          email: oldUser.email,
        });

        const link = `https://front-gamezone-production.up.railway.app/reset-password/${oldUser.id}/${token}`;

        await transporter.sendMail({
          from: "carrizosamayito@gmail.com",
          to: `${oldUser.email}`,
          subject: "Password Recovery Notification✔",
          html: `<h1>Password Recovery Notification</h1>
          <p>Hello ${oldUser.name},</p>
          <p>We received a request to reset your password. Please click the link below to reset your password:</p>
          <p><a href=${link}>Reset Password</a></p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Thank you,</p>
          <p>The Gamezone Team</p>`,
        });

        res.status(200).send("la cuenta esta en proceso de recuperacion");
        //res.status(200).json({expirationTime });
        console.log(link);
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyUrl = async (req, res) => {
  try {
    const { id, token } = req.params;
    console.log(req.params, "esto es de params");

    const oldUser = await Users.findOne({
      where: {
        id,
      },
    });

    if (!oldUser) {
      res.json({ message: "el usuario no existe" });
    } else {
      const verify = await jwt.verify(token, JWT_SECRET);

      if (verify) {
        res.status(200).json({ message: "Verify Token " });
      } else {
        return;
      }
      //res.render("index", {email: verify.email})
    }

    //res.send("Done")
  } catch (error) {
    //res.send("Not verified")
    console.log(error.message);
    //res.status(500).json({message : error.message})
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { passwordReset, passwordConfirmReset } = req.body;

    if (passwordReset !== passwordConfirmReset) {
      return res.status(400).json({ message: "Las contraseñas no coinciden" });
    } else {
      const oldUser = await Users.findByPk(id);

      if (!oldUser) {
        res.json({ message: "The user not exists" });
      } else {
        const verify = await jwt.verify(token, JWT_SECRET); // falta validar esto

        if (!verify) {
          res.status(400).json({ message: " Token Invalid" });
        } else {
          const salt = await bcrypt.genSalt(12);

          const encryptedNewPassword = await bcrypt.hash(passwordReset, salt);

          oldUser.password = encryptedNewPassword;

          await oldUser.save();
          //await token.destroy()
          res.status(200).send("cuenta recuperada");
        }
      }
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
};

module.exports = {
  forgotPassword,
  verifyUrl,
  resetPassword,
};