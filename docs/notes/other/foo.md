---
title: foo
createTime: 2024/10/10 09:50:20
permalink: /ohter/co27pv3l/
---

今天演示Archlinux的安装与配置
我打算安装到btrfs文件系统上
桌面用Hyprland，显卡是N卡
附加Windows的双系统引导

1.先去官网下载最新的ISO镜像文件，刻录到U盘，从U盘启动Arch的安装镜像，网上有很多教程，我就不演示了
2.连接互联网，如果有网线：输入命令ip link   如果没网线就连wifi
    iwctl
    station <网卡名> connect <WIFI名>
    输入密码
    quit
3.ping baidu.com  测试网络连接

我用ssh连接物理机的arch安装镜像，不在虚拟机安装
OK连上物理机了，开始安装Archlinux
安装教程:
    https://wiki.archlinux.org/title/installation_guide

1.联网

2.检验是否是UEFI64位模式
    cat /sys/firmware/efi/fw_platform_size

3.设置时区
    timedatectl set-timezone Asia/Shanghai

4.磁盘分区，注意别把数据格式化了
    前五个分区是Windows的分区，Windows有一个EFI分区，可以和Arch共用
    为Archlinux准备一个512MB的EFI分区，8G的交换分区，其余空间创建为linux filesystem分区
    cfdisk /dev/你的硬盘

5.格式化分区
    如果你为arch准备了单独的EFI分区
        mkfs.fat -F 32 /dev/efi_system_partition
    格式化交换分区
        mkswap /dev/swap_partition
    格式化btrfs文件系统
        mkfs.btrfs /dev/root_partition -f
        mount /dev/root_partition /mnt
        btrfs subvolume create /mnt/@
        btrfs subvolume create /mnt/@home
        umount /dev/root_partition

6.挂载分区
    mount /dev/root_partition /mnt -o subvol=@
    mount /dev/root_partition /mnt/home -o subvol=@home --mkdir
    mount /dev/efi_system_partition /mnt/boot/efi --mkdir
    swapon /dev/swap_partition

7.设置镜像源并安装系统
    vim /etc/pacman.d/mirrorlist
    在开头加上镜像源
        Server = https://mirrors.ustc.edu.cn/archlinux/$repo/os/$arch
        Server = https://mirrors.tuna.tsinghua.edu.cn/archlinux/$repo/os/$arch
    更新
        pacman -Sy
    安装Arch
        pacstrap -K /mnt base base-devel linux linux-firmware linux-headers git fish grub efibootmgr os-prober openssl networkmanager dhcpcd neovim
        等待安装完。

8.arch的基础配置
    挂载配置
        genfstab -U /mnt >> /mnt/etc/fstab
        arch-chroot /mnt
    时间设置
        ln -sf /usr/share/zoneinfo/Region/City /etc/localtime
        hwclock --systohc
    语言设置
        nvim /etc/locale.gen
        取消en_US.UTF-8和zh_CN.UTF-8前的注释
        locale-gen
        nvim /etc/locale.conf
        第一行写入LANG=en_US.UTF-8
    网络配置
        nvim /etc/hostname
        第一行写入你的hostname，任意添(别太任意%……#@$@*&……)
        systemctl enable dhcpcd
        systemctl enable NetworkManager
    Initramfs配置
        nvim /etc/mkinitcpio.conf
        在HOOKS中加入btrfs
        安装时忘记装btrfs了，现在装上
        pacman -S btrfs-progs
        上面这条命令会自动运行mkinitcpio -P
        如果在pacstrap中就安装了btrfs-progs，那么改完/etc/mkinitcpio.conf后需要手动运行mkinitcpio -P
        mkinitcpio -P
    Pacman配置
        检查/etc/pacman.d/mirrorlist
        nvim /etc/pacman.conf
        取消Color和ParallelDownloads前的注释
        加上一行 ILoveCandy  吃豆人彩蛋
        pacman -Syy
    用户配置
        设置root的密码
            passwd
        添加一个用户
            useradd -m -G wheel <用户名>
        设置用户密码
            passwd <用户名>
        为wheel组中的用户添加sudo权限
            nvim /etc/sudoers
            将108行的注释去掉
            会提醒这是个只读文件，不用管，直接:w!强制写入
        设置用户shell
            su <用户名>
            查看shell位置
                whereis fish
            chsh -s /usr/bin/fish
            Ctrl+D 退出用户登陆
            su <用户名>
            再次进入到用户，可以看到shell已经变了
    引导配置
        sudo grub-install --recheck /dev/你的硬盘
        sudo nvim /etc/default/grub
        将最后一行的注释去掉，启用os-prober检测双系统
        如果之前为Arch创建了单独的EFI，那么现在将windows的EFI分区挂载到任意目录 例如(/mnt)
        运行sudo os-prober看看能不能检测到windows
        sudo grub-mkconfig -o /boot/grub/grub.cfg
    配置完引导后重启电脑并拔掉U盘
        Ctrl+D 退出登陆
        umount -R /mnt 取消挂载
        reboot 重启

9.重启后
    登陆到你的用户
    连接互联网
        如果有网线跳过这一步
        nmcli device wifi connect <网络名> <密码>
    安装Nvidia驱动
        查看显卡
            lspci -k | grep -A 2 -E "(VGA|3D)"
        安装驱动
            我的台式机装的nvidia-dkms没问题，笔记本有问题，改成装nvidia而不是nvidia-dkms
            sudo pacman -S nvidia-dkms nvidia-utils nvidia-settings
            sudo pacman -S nvidia nvidia-utils nvidia-settings

            sudo nvim /etc/default/grub
            在GRUB_CMDLINE_LINUX中添加nvidia_drm.modeset=1
            sudo grub-mkconfig -o /boot/grub/grub.cfg
            sudo nvim /etc/mkinitcpio.conf
            在MODULES中加入nvidia nvidia_modeset nvidia_uvm nvidia_drm
            将kms从HOOKS中去掉
            sudo mkinitcpio -P
            reboot 重启
            nvidia-smi 验证是否安装成功
            在/etc/pacman.d/hooks/nvidia.hook中写入
[Trigger]
Operation=Install
Operation=Upgrade
Operation=Remove
Type=Package
Target=nvidia
Target=linux
# Change the linux part above if a different kernel is used

[Action]
Description=Update NVIDIA module in initcpio
Depends=mkinitcpio
When=PostTransaction
NeedsTargets
Exec=/bin/sh -c 'while read -r trg; do case $trg in linux*) exit 0; esac; done; /usr/bin/mkinitcpio -P'

            
10.安装Hyprland桌面
    sudo pacman -S hyprland kitty waybar
    sudo pacman -S sddm
    sudo pacman -S ttf-jetbrains-mono-nerd adobe-source-han-sans-cn-fonts adobe-source-code-pro-fonts
    sudo systemctl enable sddm
    reboot 重启
    等待重启，然后就能看到一个登陆界面，输入用户密码进入Hyprland
    Nvidia还要设置一下
    https://wiki.hyprland.org/Nvidia/
    CTRL+ALT+F3进如tty3并登陆用户
    nvim ~/.config/hypr/hyprland.conf
    添加NVIDIA环境变量
    env = LIBVA_DRIVER_NAME,nvidia
    env = XDG_SESSION_TYPE,wayland
    env = GBM_BACKEND,nvidia-drm
    env = __GLX_VENDOR_LIBRARY_NAME,nvidia
    env = WLR_NO_HARDWARE_CURSORS,1
    reboot 重启
    等待重启，然后就能看到一个登陆界面，输入用户密码进入Hyprland
    Win+Q 开启终端
    Win+C 关闭窗口
    Win+R 呼出菜单
    Win+数字 切换桌面
    Win+Shift+数字 将当前窗口移动到对应工作区
    Win+鼠标左键 拖动窗口
    Win+鼠标右键 调整窗口大小
    Win+V 让窗口浮动出来
    （安装OBS中。。。。）

    安装输入法
        sudo pacman -S fcitx5 fcitx5-chinese-addons fcitx5-configtool
    配置输入法
        fcitx5-configtool
    安装paru
        git clone https://aur.archlinux.org/paru.git
        cd paru
        makepkg -si
    安装rofi
        sudo pacman -S rofi
    安装chrome和vscodfe
        paru -S google-chrome
        sudo pacman -S code
    配置
        获取我的配置文件
            git clone https://github.com/HeaoYe/config
            cd config
        配置neovim
            cp nvim ~/.config/ -r
        配置chrome和vscode
            cp *.conf ~/.config/
            code
            安装插件
            clangd CMake CmakeTools CodeLLDB GruvboxTheme
            cp settings.json ~/.config/Code\ -\ OSS/User/
        配置kitty
            cp kitty ~/.config/ -r
            在~/.config/kitty/kitty.conf 中设置字体大小
        配置hyprland
            sudo pacman -S xorg-xrdb
            cp hypr ~/.config/ -r
        配置waybar
            cp waybar ~/.config/ -r
            手动启动waybar查看效果
            waybar -c ~/.config/waybar/Waybar-3.0/config -s ~/.config/waybar/Waybar-3.0/style.css
            除了第一次配置，以后会自动启动waybar
        配置声音
            sudo pacman -S pavucontrol-qt
            pavucontrol-qt
        （可选）
        安装nvtop
            sudo pacman -S nvtop
        安装grim，截图软件
            sudo pacman -S grim
        安装QQ音乐
            （我装过了，不演示了）
            paru -S qqmusic-bin
        安装大鹅，我也不知道这个软件能干什么
            paru -S daed-git
        没啥要安装的了，arch配置成功
        hyprland和waybar和kitty配置文件是clone的别人的
        链接放简介里

[bar](./bar.md)
