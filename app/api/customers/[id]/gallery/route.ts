import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth-api';

// GET - Buscar fotos da galeria do cliente
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ('error' in auth) return auth.error;

    const customerId = parseInt(params.id);

    const gallery = await prisma.customerGallery.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(gallery);
  } catch (error) {
    console.error('Erro ao buscar galeria:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar galeria' },
      { status: 500 }
    );
  }
}

// POST - Adicionar foto à galeria
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ('error' in auth) return auth.error;

    const customerId = parseInt(params.id);
    const body = await request.json();
    const { photoUrl, description, serviceDate } = body;

    if (!photoUrl) {
      return NextResponse.json(
        { error: 'URL da foto é obrigatória' },
        { status: 400 }
      );
    }

    const galleryItem = await prisma.customerGallery.create({
      data: {
        customerId,
        photoUrl,
        description: description || null,
        serviceDate: serviceDate ? new Date(serviceDate) : null
      }
    });

    return NextResponse.json(galleryItem, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar foto:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar foto' },
      { status: 500 }
    );
  }
}

// DELETE - Remover foto da galeria
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSession();
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json(
        { error: 'ID da foto é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.customerGallery.delete({
      where: { id: parseInt(photoId) }
    });

    return NextResponse.json({ message: 'Foto removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover foto:', error);
    return NextResponse.json(
      { error: 'Erro ao remover foto' },
      { status: 500 }
    );
  }
}
