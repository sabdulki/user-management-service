import { FastifyRequest, FastifyReply } from 'fastify'
import { isTokenValid } from '../../../pkg/jwt/JwtGenerator'
import { createWriteStream } from 'fs'
import path from 'path'
import fs from 'fs'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function uploadAvatar(request: FastifyRequest, reply: FastifyReply) 
{
    const payload = await isTokenValid(request);
    if (!payload)
        return reply.code(401).send();
    const userId = payload.userId;
    
    const data = await request.file()  // reads the file from the multipart body

    if (!data || !ALLOWED_TYPES.includes(data.mimetype)) {
        return reply.code(400).send({ error: 'Invalid image file' })
    }

    // Get original file name
    const originalFilename = data.filename

    // Choose a new unique name (like timestamp or UUID)
    const filename = `${Date.now()}-${originalFilename}`
    const relativePath = `avatars/${filename}`
    const fullPath = path.join(__dirname, '../../../public', relativePath)

    // Ensure directory exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })

    // Save the file to disk
    let totalSize = 0;
    await new Promise((resolve, reject) => {
        const stream = createWriteStream(fullPath)
        data.file.on('data', (chunk) => {
            totalSize += chunk.length;
            if (totalSize > MAX_FILE_SIZE) {
                stream.destroy();
                fs.unlinkSync(fullPath); // remove partial file
                return reject(new Error('File too large'));
            }
        });
        data.file.pipe(stream)
        data.file.on('end', resolve)
        data.file.on('error', reject)
      }).catch(error => {
        return reply.code(413).send({ error: 'File too large (max 2MB)' });
    });

    // Save the relative path in your DB for the user
    try {
        request.server.storage.addUserAvatar(userId, relativePath);
    } catch (error: any) {
        return reply.code(500).send()
    }
    return reply.code(200).send({ avatarUrl: `/uploads/${relativePath}` });
    // return reply.send({ avatarUrl: `/uploads/${relativePath}` })
}