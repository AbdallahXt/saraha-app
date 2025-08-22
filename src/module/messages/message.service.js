import Message from './message.model.js';
import User from '../../DB/model/user.model.js';
import { AppError } from '../../utils/error/index.js';

// Send anonymous message
export const sendMessage = async (req, res) => {
  const { username } = req.params;
  const { content } = req.body;
  const recipient = await User.findOne({ username });
  if (!recipient) throw new AppError('Recipient not found', 404);
  const message = await Message.create({
    recipient: recipient._id,
    content,
    senderIp: req.ip
  });
  res.status(201).json({ success: true, message });
};

// Get messages for authenticated user
export const getMyMessages = async (req, res) => {
  const messages = await Message.find({ recipient: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, messages });
};

// Delete message
export const deleteMessage = async (req, res) => {
  const { id } = req.params;
  const message = await Message.findOneAndDelete({ _id: id, recipient: req.user.id });
  if (!message) throw new AppError('Message not found', 404);
  res.json({ success: true, message: 'Message deleted' });
};
