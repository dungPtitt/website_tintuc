import { menuItems } from "@/constants/Menu";
import { PermissionType } from "@/constants/Role";
import { AppDataSource } from "@/database/data-source";
import { Menu } from "@/database/entities/Menu";
import { Permission } from "@/database/entities/Permission";
import { Role } from "@/database/entities/Role";
import { User } from "@/database/entities/User";
import e, { NextFunction, Request, Response } from "express"

type menuType = {
    name: string,
    url: string,
    permissions: PermissionType[]
}

export class MenuController {
  static async getMenu(req: Request, res: Response, next: NextFunction) {
    // @ts-ignore
    const permissions =  req.permissions
    console.log("user", permissions)
    const repo = AppDataSource.getRepository(Menu)
    const data = await repo.query("SELECT menu.name AS name, menu.url AS url, GROUP_CONCAT(permissions.name) AS permissions FROM menu INNER JOIN menu_permission ON menu.id = menu_permission.menuId INNER JOIN permissions ON menu_permission.permissionsId = permissions.id GROUP BY menu.name, menu.url")
    const items = data
    let menu:menuType[] = []
    for(let item of items){
        for(let permiss of item.permissions.split(',')){
        if (permissions.includes(permiss))
            menu.push(item)
            break;
        }
    }
    return res.status(200).json({menuItems: menu})
  }

  static async getRoleAndPermission(req, res, next) {
    try{
      const repo = AppDataSource.getRepository(Role)
      const roles = await repo.createQueryBuilder('roles')
      .leftJoinAndSelect("roles.permissions", "permissions")
      .getMany()

    //   const permissions = await AppDataSource.getRepository(Permission).query(`
    //     SELECT *
    //     FROM permissions
    //     LEFT JOIN role_permission ON permissions.id = role_permission.permissionsId
    //     UNION ALL
    //     SELECT *
    //     FROM permissions
    //     RIGHT JOIN role_permission ON permissions.id = role_permission.permissionsId
    //     WHERE permissions.id IS NULL
    // `);
      let permissions:any = await AppDataSource.getRepository(Permission)
      .createQueryBuilder('permissions')
      .leftJoinAndSelect('permissions.roles', 'roles')
      .getMany()
      permissions.map((item:any, index)=>{
        let all_role:any=[];
        for(let i=0; i<roles.length; i++) {
          for(let j=0; j<item.roles.length; j++) {
            if(roles[i].id != item.roles[j].id) {
              all_role.push({})
            }
            else {
              all_role.push(item.roles[j])
            }
          }
        }
        item.roles = all_role;
        return item;
      })
      return res.status(200).json({roles: roles, permissions: permissions})
    }catch(err){
      console.log(err)
      return res.status(500).json({message:"Error from server" })
    }
  }
}
