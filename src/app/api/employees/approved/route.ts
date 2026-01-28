import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/mysql-direct';

// GET approved employees (RH only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Only RH can view approved employees
    if (session.user.role !== 'RH' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Fetch approved employees with user information
    const result: any = await query(
      `SELECT 
        e.*,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email
      FROM Employe e
      INNER JOIN User u ON e.user_id = u.id
      WHERE e.statut = 'APPROUVE'
      ORDER BY e.created_at DESC`
    );

    // Format the response
    const employees = result.map((employee: any) => ({
      id: employee.id,
      userId: employee.user_id,
      nom: employee.nom,
      prenom: employee.prenom,
      email: employee.email,
      birthday: employee.birthday,
      sexe: employee.sexe,
      rib: employee.rib,
      adresse: employee.adresse,
      telephone: employee.telephone,
      dateEmbauche: employee.date_embauche,
      photo: employee.photo,
      cv: employee.cv,
      typeContrat: employee.type_contrat,
      statut: employee.statut,
      autres_documents: employee.autres_documents,
      user: {
        id: employee.user_id,
        name: employee.user_name,
        email: employee.user_email,
      }
    }));

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching approved employees:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des employés approuvés' },
      { status: 500 }
    );
  }
}