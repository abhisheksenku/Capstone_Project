const registerFraudHandlers = (io, socket)=> {
    
    // Send immediate connection log
    console.log("Fraud handler initialized for user:", socket.user.id);

    // Real-time fraud alerts (optional)
    socket.on("fraud_check_result", (result) => {
        // If needed, broadcast only to admins:
        io.to("admin_room").emit("fraud_alert", result);

        // Or broadcast to all users:
        // io.emit("fraud_alert", result);
    });

    // Nothing else required for now
};
module.exports = registerFraudHandlers;
