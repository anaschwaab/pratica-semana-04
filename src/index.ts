import { Repositorio } from 'types/repositorio';
import { Branch } from 'types/branch';
import { Commit } from 'types/commit';
import { config } from 'dotenv';
import axios from 'axios';
import fs from 'fs';
config();

export const buscaRepositorios = async (): Promise<Repositorio[]> => {
  const getRepositorio = 'https://git.raroacademy.com.br/api/v4/projects?per_page=20'
  try {
    const response = await axios.get(getRepositorio, { headers: { Authorization: `Bearer ${process.env.GITLAB_TOKEN}` } });
    const repositorios: Repositorio[] = response.data.map((repositorioData: any) => ({
        id: repositorioData.id,
        projeto: repositorioData.name,
        branches: [],
    }));

    await Promise.all(
        repositorios.map(async (repositorio) => {
            const branches = await buscaBranches(repositorio.id);
            repositorio.branches = branches;

            const repositoriosJSON = JSON.stringify(repositorios, null, 2);
            fs.writeFileSync('repositorios.json', repositoriosJSON);


            await Promise.all(
                branches.map(async (branch) => {
                    const commits = await buscaCommits(repositorio.id, branch.nome);
                    branch.commits = commits;
                })
            );
        })
    );

    const repositoriosJSON = JSON.stringify(repositorios, null, 2);
    fs.writeFileSync('repositorios.json', repositoriosJSON);

    return repositorios;
    
  } catch (error) {
    console.log(error);
    return [];
  }
};


export const buscaBranches = async (repositorioId: number): Promise<Branch[]> => {
  const getBranch = `https://git.raroacademy.com.br/api/v4/projects/${repositorioId}/repository/branches?per_page=50`;
  try {
    const response = await axios.get(getBranch, { headers: { Authorization: `Bearer ${process.env.GITLAB_TOKEN}` } });
    const branches: Branch[] = response.data.map((branchData: any) => ({
        nome: branchData.name,
        commits: [],
    }));
    return branches;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const buscaCommits = async (repositorioId: number, branchNome: string): Promise<Commit[]> => {
  const getCommit = `https://git.raroacademy.com.br/api/v4/projects/${repositorioId}/repository/commits?ref_name=${branchNome}&sort=desc`
  try {
    const response = await axios.get(getCommit, { headers: { Authorization: `Bearer ${process.env.GITLAB_TOKEN}` } });
    const commits: Commit[] = response.data.map((commitData: any) => ({
        id: commitData.id,
        mensagem: commitData.message,
        autor: commitData.author_name, 
        data: commitData.created_at,
    }));
    return commits;
  } catch (error) {
    console.log(error);
    return [];
  }
};

buscaRepositorios().then((repositorios) => {
    console.log(repositorios);
}).catch((error) => {
    console.error('Erro ao buscar repositórios: ', error)
});
