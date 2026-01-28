#!/usr/bin/env python3
"""
重置管理员密码脚本

用法:
    cd backend
    python ../scripts/reset-admin-password.py

或指定密码:
    python ../scripts/reset-admin-password.py --password your_password
"""
import argparse
import subprocess
import sys

try:
    import bcrypt
except ImportError:
    print("请先安装 bcrypt: pip install bcrypt")
    sys.exit(1)


def generate_password_hash(password: str) -> str:
    """生成 bcrypt 密码哈希"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def main():
    parser = argparse.ArgumentParser(description='重置管理员密码')
    parser.add_argument('--password', '-p', default='admin123', help='新密码 (默认: admin123)')
    parser.add_argument('--username', '-u', default='admin', help='用户名 (默认: admin)')
    parser.add_argument('--container', '-c', default='lingxian-postgres', help='Docker容器名')
    parser.add_argument('--database', '-d', default='lingxian_haowu', help='数据库名')
    parser.add_argument('--dry-run', action='store_true', help='只生成SQL，不执行')

    args = parser.parse_args()

    # 生成密码哈希
    password_hash = generate_password_hash(args.password)

    print(f"用户名: {args.username}")
    print(f"新密码: {args.password}")
    print(f"密码哈希: {password_hash}")
    print()

    # 生成 SQL
    sql = f"UPDATE admins SET password_hash = '{password_hash}' WHERE username = '{args.username}';"
    print(f"SQL: {sql}")
    print()

    if args.dry_run:
        print("(dry-run 模式，未执行)")
        return

    # 执行更新
    try:
        cmd = [
            'docker', 'exec', args.container,
            'psql', '-U', 'postgres', '-d', args.database,
            '-c', sql
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            print("密码更新成功!")
        else:
            print(f"更新失败: {result.stderr}")
    except FileNotFoundError:
        print("请确保 Docker 已安装并在 PATH 中")
        print(f"手动执行: docker exec {args.container} psql -U postgres -d {args.database} -c \"{sql}\"")


if __name__ == '__main__':
    main()
