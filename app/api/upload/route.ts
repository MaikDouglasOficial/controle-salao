import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo inválido. Use JPEG, PNG, WEBP ou GIF' },
        { status: 400 }
      );
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 5MB' },
        { status: 400 }
      );
    }

    // Converter para buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Gerar nome único
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}.${extension}`;

    // Salvar no diretório public/uploads
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    
    // Criar diretório se não existir
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Diretório já existe
    }

    // Salvar arquivo
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Retornar URL pública
    const url = `/uploads/${filename}`;

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return NextResponse.json(
      { error: 'Erro ao processar upload' },
      { status: 500 }
    );
  }
}
